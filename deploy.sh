
cd layers/googleApisLambdaLayer/nodejs
npm install
cd -
sam package --template-file template.yml --output-template-file package.yml --s3-bucket readable-stage-depl-bucket --region eu-west-1 --profile default
sam deploy --template-file package.yml --stack-name readable-stage-stack --capabilities CAPABILITY_IAM --region eu-west-1 --tags ReadableProject=1 --profile default