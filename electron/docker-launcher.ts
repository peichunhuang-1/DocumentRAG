import { imageConfigProps, userProps } from './types';
import * as path from 'path';
import { createRequire } from 'node:module'
import * as fs from 'fs';
const require = createRequire(import.meta.url);
const Docker = require('dockerode');

const docker = new Docker();

const __root__ = process.env.HOME || process.env.USERPROFILE;
const __dir__ = path.join(__root__ || "/", '.research.go', 'users');

const images: imageConfigProps[] = [
  { name: 'robwilkes/unstructured-api', port: '5051', internalPort: '8000' },
  { name: 'chromadb/chroma', port: '5050', internalPort: '8000' },
];

function ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

async function pullImageIfNotExists(imageName: string): Promise<void> {
  try {
    const image = docker.getImage(imageName);
    await image.inspect(); 
    console.log(`${imageName} already exists.`);
  } catch (error) {
    console.log(`${imageName} not found, pulling...`);
    await docker.pull(imageName);
    console.log(`${imageName} pulled successfully.`);
  }
}

async function runContainer(
  imageName: string,
  port: string,
  internalPort: string,
  volumeName?: string,
  envs? : string[]
): Promise<any> {
  const containerConfig = {
    Image: imageName,
    Env: envs? envs: [],
    HostConfig: {
      PortBindings: {
        [`${internalPort}/tcp`]: [{ HostPort: port }],
      },
      Binds: volumeName ? [volumeName] : [],
      AutoRemove: true,
    },
  };

  const container = await docker.createContainer(containerConfig);
  await container.start();
  console.log(`${imageName} container started and port ${port} mapped to host.`);
  return container;
}

export async function stopAndRemoveContainers(containers: any[]): Promise<void> {
  for (let container of containers) {
    await container.stop();
    console.log(`Container stopped.`);
  }
}

export async function launchDockerContainers(user: userProps) {
    const userDir = path.join(__dir__, user.name);
    const indexDir = path.join(userDir, 'index'); // indexed data
    console.log(`volume: ${indexDir}`);
    ensureDirectoryExists(indexDir);
    try {
        await Promise.all(images.map((image) => pullImageIfNotExists(image.name)));
        const unstructuredContainer = await runContainer('robwilkes/unstructured-api', '5051', '8000');
        const chromadbContainer = await runContainer('chromadb/chroma', '5050', '8000', `${indexDir}:/chroma/chroma:rw`, ['CHROMA_SERVER_CORS_ALLOW_ORIGINS=["http://localhost:*"]']);
        return [unstructuredContainer, chromadbContainer];
    } catch (error) {
        console.error('Error during docker operations: ', error);
        throw error;
    }
}