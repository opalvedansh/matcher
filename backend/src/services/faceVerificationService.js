const { RekognitionClient, CompareFacesCommand } = require('@aws-sdk/client-rekognition');
const logger = require('../config/logger');

// Initialize Rekognition Client
// Note: It will automatically use AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY from the environment
const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

/**
 * Compares two images to check if they contain the same person's face.
 * @param {Buffer} sourceImageBuffer - The reference image (e.g., from the user's profile)
 * @param {Buffer} targetImageBuffer - The captured image (e.g., selfie from the mobile app)
 * @param {number} similarityThreshold - The minimum similarity score to consider a match (default: 80)
 * @returns {Promise<{ isMatch: boolean, similarity: number, error: string|null }>}
 */
async function verifyFaceMatch(sourceImageBuffer, targetImageBuffer, similarityThreshold = 80) {
  try {
    const params = {
      SourceImage: { Bytes: sourceImageBuffer },
      TargetImage: { Bytes: targetImageBuffer },
      SimilarityThreshold: similarityThreshold,
    };

    const command = new CompareFacesCommand(params);
    const response = await rekognition.send(command);

    if (response.FaceMatches && response.FaceMatches.length > 0) {
      const match = response.FaceMatches[0];
      return {
        isMatch: true,
        similarity: match.Similarity,
        error: null,
      };
    } else {
      return {
        isMatch: false,
        similarity: 0,
        error: 'No matching faces found in the images.',
      };
    }
  } catch (error) {
    logger.error('Face verification failed:', error);
    
    let errorMessage = 'An error occurred during facial verification.';
    if (error.name === 'InvalidParameterException') {
      errorMessage = 'One of the images did not contain a clearly visible face.';
    } else if (error.name === 'AccessDeniedException') {
      errorMessage = 'Server configuration error: AWS Rekognition access denied.';
    }
    
    return {
      isMatch: false,
      similarity: 0,
      error: errorMessage,
    };
  }
}

module.exports = {
  verifyFaceMatch,
};
