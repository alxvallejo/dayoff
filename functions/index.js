const functions = require('firebase-functions');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const sharp = require('sharp');

const gcs = new Storage();

const THUMB_MAX_WIDTH = 200;
const THUMB_MAX_HEIGHT = 200;

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.generateThumbnail = functions.storage.object().onFinalize(async (object) => {
	const fileBucket = object.bucket; // The Storage bucket that contains the file.
	const filePath = object.name; // File path in the bucket.
	const contentType = object.contentType; // File content type.
	const resourceState = object.resourceState; // The resourceState is 'exists' or 'not_exists' (for file/folder deletions).
	const metageneration = object.metageneration; // Number of times metadata has been generated. New objects have a value of 1.

	// Exit if this is triggered on a file that is not an image.
	if (!contentType.startsWith('image/')) {
		console.log('This is not an image.', object);
		return;
	}

	// Get the file name.
	const fileName = path.basename(filePath);
	console.log('filePath is', filePath);
	// Exit if the image is already a thumbnail.
	if (fileName.startsWith('thumb_')) {
		console.log('Already a Thumbnail, bc fileName starts with thumb_.', fileName);
		return;
	}

	// Exit if this is a move or deletion event.
	if (resourceState === 'not_exists') {
		console.log('This is a deletion event.');
		return;
	}

	// Exit if file exists but is not new and is only being triggered
	// because of a metadata change.
	if (resourceState === 'exists' && metageneration > 1) {
		console.log('This is a metadata change event.');
		return;
	}

	// Get the user id from the path
	const fileDir = path.dirname(filePath);
	console.log('fileDir: ', fileDir);
	let nameParts = fileDir.split('/');
	console.log('nameParts: ', nameParts);
	let userId;
	if (nameParts[0] === 'profile_photos') {
		userId = nameParts[1];
		console.log('userId', userId);
	}

	// Download file from bucket.
	const bucket = gcs.bucket(fileBucket);

	const metadata = {
		contentType: contentType,
	};
	// We add a 'thumb_' prefix to thumbnails file name. That's where we'll upload the thumbnail.
	const thumbFileName = `thumb_${fileName}`;
	const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);
	// Create write stream for uploading thumbnail
	const thumbnailUploadStream = bucket.file(thumbFilePath).createWriteStream({ metadata });

	// Create Sharp pipeline for resizing the image and use pipe to read from bucket read stream
	const pipeline = sharp();
	pipeline.rotate().resize(THUMB_MAX_WIDTH, THUMB_MAX_HEIGHT).pipe(thumbnailUploadStream);

	bucket.file(filePath).createReadStream().pipe(pipeline);

	const streamAsPromise = new Promise((resolve, reject) =>
		thumbnailUploadStream
			.on('finish', async () => {
				// Save the Signed URLs for the thumbnail and original image to the user profile.
				const config = {
					action: 'read',
					expires: '03-01-2500',
				};
				const thumbFile = bucket.file(thumbFilePath);
				const file = bucket.file(filePath);
				const results = await Promise.all([thumbFile.getSignedUrl(config), file.getSignedUrl(config)]);
				console.log('Got Signed URLs.');
				const thumbResult = results[0];
				const originalResult = results[1];
				const thumbFileUrl = thumbResult[0];
				const fileUrl = originalResult[0];
				// Add the URLs to the Database
				await admin
					.database()
					.ref(`users/${userId}/profile/photo`)
					.set({ path: fileUrl, thumbnail: thumbFileUrl });
				console.log('Thumbnail URLs saved to database.');

				resolve;
			})
			.on('error', reject)
	);
	return streamAsPromise.then(() => {
		console.log('Thumbnail created successfully');
	});
});
