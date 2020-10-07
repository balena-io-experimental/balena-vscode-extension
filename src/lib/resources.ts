import * as path from 'path';

function getPath(imagePath: string) {
    return path.resolve(__filename, '../../../resources', imagePath);
}

export const icons = {
    balena: getPath('balena.png'),
}