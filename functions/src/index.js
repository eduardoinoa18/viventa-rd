const functions = require('firebase-functions');
const admin = require('firebase-admin');
const algoliasearch = require('algoliasearch');
const { computeFinalScore } = require('./searchIndexUtils');

admin.initializeApp();
const db = admin.firestore();

const ALG_APP = functions.config().algolia.app_id;
const ALG_KEY = functions.config().algolia.api_key;
const ALG_INDEX = functions.config().algolia.index || 'viventa_listings';
const client = algoliasearch(ALG_APP, ALG_KEY);
const index = client.initIndex(ALG_INDEX);

exports.onListingCreate = functions.firestore.document('listings/{id}')
  .onCreate(async (snap, ctx) => {
    const data = snap.data();
    const score = computeFinalScore(data);
    const obj = { objectID: snap.id, ...data, score };
    await index.saveObject(obj);
    console.log('Indexed', snap.id);
  });

exports.onListingUpdate = functions.firestore.document('listings/{id}')
  .onUpdate(async (change, ctx) => {
    const data = change.after.data();
    const score = computeFinalScore(data);
    const obj = { objectID: change.after.id, ...data, score };
    await index.saveObject(obj);
    console.log('Updated index', change.after.id);
  });

exports.onListingDelete = functions.firestore.document('listings/{id}')
  .onDelete(async (snap, ctx) => {
    await index.deleteObject(snap.id).catch(()=>{});
    console.log('Deleted from index', snap.id);
  });
