const dev = {
  STRIPE_KEY: "pk_test_XeDS7xVuwV9cQPhx2OGLN1uA",
  s3: {
    REGION: "ap-southeast-2",
    BUCKET: "lydia-api-dev-attachmentsbucket-1b4cv85suxgsg"
  },
  apiGateway: {
    REGION: "ap-southeast-2",
    URL: "https://lydia-api.willpilgrim.me/dev"
  },
  cognito: {
    REGION: "ap-southeast-2",
    USER_POOL_ID: "ap-southeast-2_QZ0juoOZl",
    APP_CLIENT_ID: "2utqgml62c2htgvrtn3ncba08h",
    IDENTITY_POOL_ID: "ap-southeast-2:db922c2c-d1f0-4ddb-88fc-9ac374c82829"
  }
};

const prod = {
  STRIPE_KEY: "pk_test_XeDS7xVuwV9cQPhx2OGLN1uA",
  s3: {
    REGION: "ap-southeast-2",
    BUCKET: "lydia-api-prod-attachmentsbucket-1r6hbexp2vyzg"
  },
  apiGateway: {
    REGION: "ap-southeast-2",
    URL: "https://lydia-api.willpilgrim.me/prod"
  },
  cognito: {
    REGION: "ap-southeast-2",
    USER_POOL_ID: "ap-southeast-2_Ka1Aszx48",
    APP_CLIENT_ID: "2ekk3h2bl6he29gprkh5nf1ifo",
    IDENTITY_POOL_ID: "ap-southeast-2:fb04d10a-793c-416d-afe3-2a1af308302d"
  }
};

// Default to dev if not set
const config = process.env.REACT_APP_STAGE === 'prod'
  ? prod
  : dev;

export default {
  // Add common config values here
  MAX_ATTACHMENT_SIZE: 5000000,
  ...config
};