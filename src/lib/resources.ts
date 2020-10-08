import * as path from 'path';
import * as fs from 'fs';

function getPath(imagePath: string) {
    const resolvedPath = path.resolve(__filename, '../../../resources', imagePath);
    
    return fs.existsSync(resolvedPath) ? resolvedPath : undefined;
}

export const icons = {
    balena: getPath('icons/balena.png') ?? '',
    balenaDark: getPath('icons/balena-dark.png') ?? '',
};

export const deviceIcon = (deviceType: string) => getPath(`devices/${deviceType}.svg`) ?? getPath('devices/unknown-color.svg') ?? '';
export const scripts = (scriptName: string) => getPath(`scripts/${scriptName}`) ?? scriptName;