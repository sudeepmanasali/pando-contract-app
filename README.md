# pando-contract-app

1. To create and run whole application in dev mode
   - docker compose -f docker-compose.dev.yml up --build
2. To create containers and run whole application in production mode
   - docker compose -f docker-compose.prod.yml up --build
3. To build a Docker image from a Dockerfile
   - docker build -t <image-name> .
4. To create and start a container from an image
   - docker run -d --name <container-name> -p <host-port>:<container-port> <image-name>
5. Frontend app runs at: 
   - dev: 3000
   - prod: 80
6. Backend app runs at 8089
7. Backend app uses nginx in prod and listens at 8089
8. To restart single service
   - docker-compose restart <service-name1> <service-name2>
9. To recreate the specific service image
   - docker-compose up --build <service-name> 
10. Script to create the csv file with required number of entries, Run create-csv script in google colab