import * as tf from '@tensorflow/tfjs-node';

async function evaluateModel() {
    // Load the saved model
    const model = await tf.loadLayersModel('file://./model/model.json');

    // Load test data
    const testData = await loadTestData();

    // Evaluate the model
    const evaluation = model.evaluate(testData.features, testData.labels);
    const loss = evaluation[0].dataSync()[0];
    const accuracy = evaluation[1].dataSync()[0];

    console.log(`Test Loss: ${loss}`);
    console.log(`Test Accuracy: ${accuracy}`);

    // Perform predictions
    const predictions = model.predict(testData.features);
    const predictedLabels = predictions.argMax(-1).dataSync();

    // Calculate additional metrics (precision, recall, F1)
    const metrics = calculateMetrics(testData.labels, predictedLabels);
    console.log('Precision:', metrics.precision);
    console.log('Recall:', metrics.recall);
    console.log('F1 Score:', metrics.f1);
}

async function loadTestData() {
    // Minimal dummy test data to make this script valid.
    // Replace with real data loading logic as needed.
    // Example: two samples with two features each, and binary labels.
    const features = tf.tensor2d(
        [
            [0.1, 0.9],
            [0.8, 0.2]
        ]
    );
    const labels = tf.tensor1d([0, 1], 'int32');

    return { features, labels };
}

function calculateMetrics(trueLabels, predictedLabels) {
    // Implement precision, recall, and F1 calculation
    let truePositives = 0, falsePositives = 0, falseNegatives = 0;

    const trueLabelArray = trueLabels.dataSync();
    for (let i = 0; i < trueLabelArray.length; i++) {
        if (trueLabelArray[i] === 1 && predictedLabels[i] === 1) {
            truePositives++;
        } else if (trueLabelArray[i] === 0 && predictedLabels[i] === 1) {
            falsePositives++;
        } else if (trueLabelArray[i] === 1 && predictedLabels[i] === 0) {
            falseNegatives++;
        }
    }

    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1 = 2 * (precision * recall) / (precision + recall) || 0;

    return { precision, recall, f1 };
}

evaluateModel().then(() => {
    console.log('Evaluation complete!');
}).catch(err => {
    console.error('Error during evaluation:', err);
});
