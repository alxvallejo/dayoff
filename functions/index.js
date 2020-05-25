const functions = require('firebase-functions');
const gcs = require('@google-cloud/storage')();
const path = require('path');
const sharp = require('sharp');

const THUMB_MAX_WIDTH = 200;
const THUMB_MAX_HEIGHT = 200;

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.generateThumbnail = functions.storage.object().onChange((event) => {
	//console.log("event is", event);
	const object = event.data; // The Storage object.

	const fileBucket = object.bucket; // The Storage bucket that contains the file.
	const filePath = object.name; // File path in the bucket.
	const contentType = object.contentType; // File content type.
	const resourceState = object.resourceState; // The resourceState is 'exists' or 'not_exists' (for file/folder deletions).
	const metageneration = object.metageneration; // Number of times metadata has been generated. New objects have a value of 1.

	// Exit if this is triggered on a file that is not an image.
	if (!contentType.startsWith('application/octet-stream')) {
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

	// get user id and sessionId
	//let nameParts = filePath.split("/");
	//let userId, sessionId;
	// if (nameParts[0] === "profile_pictures") {
	//   this.userId = nameParts[1];
	//   this.sessionId = nameParts[2];
	//   console.log("userId", this.userId);
	//   console.log("sessionId", this.sessionId);
	// }

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
	pipeline.rotate().resize(THUMB_MAX_WIDTH, THUMB_MAX_HEIGHT).max().pipe(thumbnailUploadStream);

	bucket.file(filePath).createReadStream().pipe(pipeline);

	const streamAsPromise = new Promise((resolve, reject) =>
		thumbnailUploadStream
			.on('finish', () => {
				if (this.userId && this.sessionId) {
					let adminRoot = object.adminRef.root;
					adminRoot
						.child('/users/' + this.userId + '/profile/profile_pictures')
						.once('value')
						.then((snapshot) => {
							let profile_pictures = snapshot.val();
							let target_photo_index = profile_pictures.findIndex((x) => x.name === this.sessionId);
							console.log('profile_pictures', profile_pictures);
							console.log('target_photo_index', target_photo_index);
							if (target_photo_index) {
								let target_photo = profile_pictures[target_photo_index];
								console.log('target_photo', target_photo);
								if (!target_photo.hasOwnProperty('thumbnail')) {
									let updates = {};
									let path =
										'/users/' +
										this.userId +
										'/profile/profile_pictures/' +
										target_photo_index +
										'/thumbnail';
									updates[path] = thumbFilePath;
									adminRoot.update(updates).then(() => {
										console.log(
											'thumbnail successfully added to profile_photos of user ' + this.userId
										);
									});
								}
							}
						});
				}
				resolve;
			})
			.on('error', reject)
	);
	return streamAsPromise.then(() => {
		console.log('Thumbnail created successfully');
	});
});

exports.setStatusPhoto = functions.database
	.ref('/users/{uid}/profile/profile_pictures/0/thumbnail')
	.onWrite((event) => {
		const { uid } = event.params;
		const uri = event.data.val();
		if (!uri) {
			console.log('no uri for the path i guess');
			return;
		}

		// need to grab the setPool from profile
		let snapshotProfile = admin
			.database()
			.ref('/users/' + uid + '/profile')
			.once('value')
			.then((snapshot) => {
				let profile = snapshot.val();
				let setPool = profile.setPool;
				if (setPool) {
					let status_ids = [];

					// get user statuses
					let snapshot = admin
						.database()
						.ref('/users/' + uid + '/statuses/')
						.once('value')
						.then((snapshot) => {
							let yourStatuses = snapshot.val();
							status_ids = Object.keys(yourStatuses).map((key) => {
								let status = yourStatuses[key];
								return status.id;
							});

							if (status_ids.length < 1) {
								console.log('status ids length is less than 1');
								return;
							}

							status_ids.forEach((status_id) => {
								//console.log("status id is", status_id);
								snapshot = admin
									.database()
									.ref('/statuses/' + setPool + '/' + status_id)
									.once('value')
									.then((snapshot) => {
										let status = snapshot.val();
										if (status) {
											let updates = Object.assign({}, status, { photoURL: uri });
											admin
												.database()
												.ref('/statuses/' + setPool + '/' + status_id)
												.update(updates);
										}
									});
							});

							console.log('Finished syncing new photo with statuses');
						});
				}
			});
	});
