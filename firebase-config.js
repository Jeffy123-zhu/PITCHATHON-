/**
 * Firebase Configuration
 * Replace the values below with your own Firebase project config
 */

const firebaseConfig = {
    apiKey: "AIzaSyA9G5E5K6qTGDoF5EKs0psuqP28eAz3-BQ",
    authDomain: "world-mood-1d307.firebaseapp.com",
    databaseURL: "https://world-mood-1d307-default-rtdb.firebaseio.com",
    projectId: "world-mood-1d307",
    storageBucket: "world-mood-1d307.firebasestorage.app",
    messagingSenderId: "396125975930",
    appId: "1:396125975930:web:5488161ba0afdac6f712c3"
};

// Global variables for Firebase
let database = null;
let firebaseInitialized = false;

/**
 * Initialize Firebase
 */
function initFirebase() {
    try {
        if (firebaseConfig.apiKey === "YOUR_API_KEY") {
            console.log('Firebase not configured - running in demo mode');
            return false;
        }
        
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        firebaseInitialized = true;
        console.log('Firebase connected!');
        return true;
    } catch (error) {
        console.error('Firebase error:', error);
        return false;
    }
}

/**
 * Save mood to Firebase
 */
function saveMoodToFirebase(moodData) {
    if (!firebaseInitialized) return;
    
    database.ref('moods').push({
        moodType: moodData.moodType,
        locationName: moodData.location.name,
        lat: moodData.location.lat,
        lng: moodData.location.lng,
        timestamp: moodData.timestamp
    });
}

/**
 * Listen for new moods from other users
 */
function listenForMoods(callback) {
    if (!firebaseInitialized) return;
    
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    database.ref('moods')
        .orderByChild('timestamp')
        .startAt(oneHourAgo)
        .on('child_added', function(snapshot) {
            const data = snapshot.val();
            if (data) {
                callback({
                    moodType: data.moodType,
                    location: {
                        name: data.locationName,
                        lat: data.lat,
                        lng: data.lng
                    },
                    timestamp: data.timestamp
                });
            }
        });
}
