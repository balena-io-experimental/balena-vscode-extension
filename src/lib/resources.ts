import * as path from 'path';

function getPath(imagePath: string) {
    return path.resolve(__filename, '../../../resources', imagePath);
}

export const icons = {
    balena: getPath('icons/balena.png'),
};

export const deviceIcon = (deviceType: string) => getPath(`devices/${deviceType}.svg`);
export const scripts = (scriptName: string) => getPath(`scripts/${scriptName}`);