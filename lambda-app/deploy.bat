
::#git branch | find "* master" > NUL & IF ERRORLEVEL 1 (
::#    ECHO I am NOT on master
::#) ELSE (
    call sam package --template-file template.yml --output-template-file package.yml --s3-bucket dyslexia-readable-depl-bucket --region eu-west-1 --profile dyslexiaproduction
    call sam deploy --template-file package.yml --stack-name readable-stage-stack --capabilities CAPABILITY_IAM --region eu-west-1 --tags ReadableProject=1 --profile dyslexiaproduction
::#)
::# aws cloudformation delete-stack --stack-name readable-stage-stack --profile dyslexiaproduction
