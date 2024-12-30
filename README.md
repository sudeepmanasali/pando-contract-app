# pando-contract-app

**Tech Stack:** MERN

**Technologies:** Redis, Bull queue and Redis, Docker, Docker Compose, NGINX

status counts: 
success : Number of records saved into database
failed : Number of records not saved into database
invalidInput & failedCount : Indicates the reason why the records were not saved into database (overlapping, invalid date)

**System Design Data Flow**
![image](https://github.com/user-attachments/assets/943315d7-4bb4-4194-98b9-6751614cd909)

**Steps to run**

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
7. Backend app uses nginx in prod env and listens at 8089
8. To restart single service
   - docker-compose restart <service-name1> <service-name2>
9. To recreate the specific service image
   - docker-compose up --build <service-name> 
10. Script to create the csv file with required number of entries, Run create-csv.py file script in google colab
11. **Demo**: https://github.com/user-attachments/assets/b5d23b64-97d0-4002-a984-06162301bf16

Creating the environment files in respective apps, and change it as per your convenience

**Backend App Env variables**
   - MONGODBURL=mongodb://mongodb:27017/test (mongodb://service-name or mongodbhostname:port-no/dbname)
   - REDIS=redis (redis hostname or service name)
   - REDIS_PORT=6379

**Frontend App Env variables**
   - BACKEND_API_URL=http://localhost:8089

**Data-workers App Env variables**
   - MONGODBURL=mongodb://mongodb:27017/test
   - REDIS=redis
   - REDIS_PORT=6379
