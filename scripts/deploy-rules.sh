#!/bin/bash
# Deploy Firestore security rules

echo "Deploying Firestore rules..."
firebase deploy --only firestore:rules

echo "Done!"
