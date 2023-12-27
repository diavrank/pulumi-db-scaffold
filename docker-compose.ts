

export const dockerComposeYaml = `
version: '3'

services:
  mongo-primary:
    container_name: mongo-primary
    image: bitnami/mongodb:6.0.4
    restart: always
    ports: 
      - 27017:27017
    environment:
      - MONGODB_ADVERTISED_HOSTNAME=mongo-primary
      - MONGODB_REPLICA_SET_MODE=primary
      - MONGODB_REPLICA_SET_NAME=rs0
      - MONGODB_ROOT_PASSWORD
      - MONGODB_REPLICA_SET_KEY
      - MONGODB_USERNAME
      - MONGODB_PASSWORD
      - MONGODB_DATABASE
    volumes:
      - $PWD/data:/bitnami
      - $PWD/database:/opt/database
    networks:
      - scaffold-net
  mongo-secondary:
    container_name: mongo-secondary
    image: bitnami/mongodb:6.0.4
    restart: always
    ports: 
      - 28017:27017
    depends_on:
      - mongo-primary
    environment:
      - MONGODB_ADVERTISED_HOSTNAME=mongo-secondary
      - MONGODB_REPLICA_SET_MODE=secondary
      - MONGODB_REPLICA_SET_NAME=rs0
      - MONGODB_INITIAL_PRIMARY_HOST
      - MONGODB_INITIAL_PRIMARY_PORT_NUMBER
      - MONGODB_INITIAL_PRIMARY_ROOT_PASSWORD
      - MONGODB_REPLICA_SET_KEY
    networks:
      - scaffold-net
  mongo-arbiter:
    container_name: mongo-arbiter
    image: bitnami/mongodb:6.0.4
    restart: always
    ports: 
      - 29017:27017
    depends_on:
      - mongo-primary
    environment:
      - MONGODB_ADVERTISED_HOSTNAME=mongo-arbiter
      - MONGODB_REPLICA_SET_MODE=arbiter
      - MONGODB_REPLICA_SET_NAME=rs0
      - MONGODB_INITIAL_PRIMARY_HOST
      - MONGODB_INITIAL_PRIMARY_PORT_NUMBER
      - MONGODB_INITIAL_PRIMARY_ROOT_PASSWORD
      - MONGODB_REPLICA_SET_KEY
    networks:
      - scaffold-net
networks:
  scaffold-net:
`;
