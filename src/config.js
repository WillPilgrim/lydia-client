const dev = {
  STRIPE_KEY: "pk_test_XeDS7xVuwV9cQPhx2OGLN1uA",
  s3: {
    REGION: "ap-southeast-2",
    BUCKET: "lydia-api-dev-attachmentsbucket-12ip4a2786aff"
  },
  apiGateway: {
    REGION: "ap-southeast-2",
    URL: "https://api.willpilgrim.me/dev"
  },
  cognito: {
    REGION: "ap-southeast-2",
    USER_POOL_ID: "ap-southeast-2_cL1CykOzj",
    APP_CLIENT_ID: "4tmkqnpffo1erm45mejtoc18ne",
    IDENTITY_POOL_ID: "ap-southeast-2:251d3a9a-d477-443d-a735-4deb0d861192"
  }
};

const prod = {
  STRIPE_KEY: "pk_test_XeDS7xVuwV9cQPhx2OGLN1uA",
  s3: {
    REGION: "ap-southeast-2",
    BUCKET: "lydia-api-prod-attachmentsbucket-6gnrf4333w1n"
  },
  apiGateway: {
    REGION: "ap-southeast-2",
    URL: "https://api.willpilgrim.me/prod"
  },
  cognito: {
    REGION: "ap-southeast-2",
    USER_POOL_ID: "ap-southeast-2_DHTs9VCqV",
    APP_CLIENT_ID: "6f55gc0rqq4154o0drgo2tfoqb",
    IDENTITY_POOL_ID: "ap-southeast-2:7946f29b-198e-43b1-8c92-46870e21015f"
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