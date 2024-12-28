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
8. Script to create the csv file with required number of entries, Run the below script in google colab
7. Python code:

import pandas as pd
import random
from datetime import datetime, timedelta

import random
import string

def generate_random_string(length):
    # Generate a random string of specified length from uppercase and lowercase letters and digits
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

shippers = ['VWX Logistics', 'ABC Shipping', 'XYZ Freight', 'PQR Transport']
transporters = ['YZA Express', 'LMN Haulage', 'QRS Movers', 'DEF Logistics']
vehicle_types = ['Truck', 'Train', 'Ship', 'Plane']
sources = ['Dublin', 'London', 'Paris', 'Berlin', 'Madrid', 'Rome']
destinations = ['Madrid', 'London', 'Paris', 'Berlin', 'Rome', 'New York']

def random_date(start_date, end_date):
    time_delta = end_date - start_date
    random_days = random.randint(0, time_delta.days)
    return start_date + timedelta(days=random_days)

def generate_random_row():
    shipper = random.choice(shippers)
    transporter = random.choice(transporters)
    vehicle_type = random.choice(vehicle_types)
    source = random.choice(sources)
    destination = random.choice(destinations)

    valid_from_date = datetime.strptime('2024-04-25', '%Y-%m-%d')
    valid_to_date = datetime.strptime('2026-12-10', '%Y-%m-%d')
    valid_from = random_date(valid_from_date, valid_to_date)
    valid_to = random_date(valid_from, valid_to_date)

    return {
        'contractID':  generate_random_string(10),
        'shipper': shipper,
        'transporter': transporter,
        'validFrom': valid_from.strftime('%Y-%m-%d'),
        'validTo': valid_to.strftime('%Y-%m-%d'),
        'vehicleType': vehicle_type,
        'source': source,
        'destination': destination
    }

data = [generate_random_row() for _ in range(500000)]

df = pd.DataFrame(data)

df.to_csv('/content/contracts_data_100000_rows.csv', index=False)

print("CSV file 'generated_data.csv' has been created with 500,000 unique rows.")
