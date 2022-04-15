
::#git branch | find "* master" > NUL & IF ERRORLEVEL 1 (
::#    ECHO I am NOT on master
::#) ELSE (
    call sam package --template-file template.andrii.yml --output-template-file package.andrii.yml --s3-bucket readable-stage-depl-bucket-a --region eu-west-2 --profile default
    call sam deploy --template-file package.andrii.yml --stack-name readable-stage-stack-a --capabilities CAPABILITY_IAM --region eu-west-2 --tags ReadableProject=1 --profile default
::#)
::# aws cloudformation delete-stack --stack-name readable-stage-stack --profile default
