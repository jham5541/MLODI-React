// Import necessary libraries
import { supabase } from '../lib/supabase/client';
import * as tf from '@tensorflow/tfjs-node';

async function collectAndPreprocessData() {
    // Collect user listening history and audio features
    const { data: listeningHistory, error: historyError } = await supabase
        .from('listening_history')
        .select('track_id, audio_features')
        .limit(1000);

    if (historyError) {
        console.error('Error fetching listening history:', historyError);
        return;
    }

    // Preprocess the data
    const normalizedData = preprocessData(listeningHistory);

    console.log('Data collected and preprocessed successfully!');
    return normalizedData;
}

function preprocessData(data) {
    // Fill missing values and normalize features
    const filledData = data.map(item => ({
        track_id: item.track_id,
        features: fillMissingValues(item.audio_features)
    }));

    // Normalize features (Min-Max Scaling)
    const features = filledData.map(item => item.features);
    const featureTensor = tf.tensor2d(features);
    const max = featureTensor.max(0);
    const min = featureTensor.min(0);
    const normalizedTensor = featureTensor.sub(min).div(max.sub(min));

    return {
        track_ids: filledData.map(item => item.track_id),
        features: normalizedTensor
    };
}

function fillMissingValues(features) {
    // Fill missing feature values with mean or default
    const defaults = {
        tempo: 120.0,
        energy: 0.5,
        valence: 0.5,
        danceability: 0.5,
        acousticness: 0.5
    };
    return {
        ...defaults,
        ...features
    };
}

collectAndPreprocessData().then(() => {
    console.log('Data collection and preprocessing complete!');
}).catch(err => {
    console.error('Error in data collection and preprocessing:', err);
});

