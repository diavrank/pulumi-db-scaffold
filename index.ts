import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import {installDocker} from "./installers/install-docker";
import {installDockerCompose} from "./installers/install-docker-compose";
import {dockerComposeYaml} from "./docker-compose";
import {installDoppler} from "./installers/install-doppler";

const projectName = process.env.PROJECT_NAME || 'myProjectName';
const serviceToken = process.env.SERVICE_TOKEN;

console.log('project: ', projectName);
console.log('service token: ', serviceToken);

const computeNetwork = new gcp.compute.Network("network", {
    autoCreateSubnetworks: true,
});

const computeFirewall = new gcp.compute.Firewall("firewall", {
    network: computeNetwork.selfLink,
    allows: [{
        protocol: "tcp",
        ports: [ "22", "80", "27017", "28017", "29017" ],
    }],
    sourceRanges: ["0.0.0.0/0"],
    sourceTags: ["http-server"],
});

const startupScript = `#!/bin/bash
# Set working directory
cd /opt/

# Download backup
git clone https://github.com/diavrank/${projectName}
cd ${projectName}

# Install Docker
${installDocker}

# Install Docker Compose
${installDockerCompose}

# Install Doppler
${installDoppler}


# Create Docker Compose Yaml file
sudo su
cat <<EOF > docker-compose.yml
${dockerComposeYaml}
EOF

# Prepare mongo server volume
mkdir data
sudo chown -R 1001 data

# Configure doppler service token
export HISTIGNORE='doppler*'
echo '${serviceToken}' | doppler configure set token --scope /opt/${projectName}

# Run mongo servers
doppler run -- docker-compose up -d mongo-primary mongo-secondary mongo-arbiter
sleep 7

# Load initial backup
docker exec -ti mongo-primary bash -c 'cd /opt/database && sh restore-db.sh'

`;

const computeInstance = new gcp.compute.Instance("pulumi-instance", {
    machineType: "e2-medium",
    metadataStartupScript: startupScript,
    bootDisk: {
        initializeParams: {
            image: "ubuntu-os-cloud/ubuntu-2004-lts", // get list names with command: gcloud compute images list
            size: 25, // Boot disk size in GB
        },
    },
    networkInterfaces: [{
        network: computeNetwork.id,
        accessConfigs: [{}], // must be empty to request an ephemeral IP
    }],
    serviceAccount: {
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    },
    tags: ["http-server"]
}, { dependsOn: [computeFirewall] });

exports.instanceName = computeInstance.name;
// @ts-ignore
exports.instanceIP = computeInstance.networkInterfaces.apply(nics => nics[0].accessConfigs[0].natIp);
