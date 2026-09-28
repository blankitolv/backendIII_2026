import path from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import { expect } from 'chai';
import {
  resolveInsideUploadRoot,
  extensionForMime,
  crearUploader
} from '../../src/config/multer.js';
import { config } from '../../src/config/config.js';

// Esta es la guarda que impide que un `path` manipulado en la base sirva un archivo de
// cualquier parte del sistema. Se prueba sin base de datos: es funcion pura sobre la raiz.
describe('unit - multer.config', () => {
  describe('resolveInsideUploadRoot', () => {
    it('acepta un archivo que esta dentro de la raiz', () => {
      const dentro = path.join(config.upload.documentsDir, '1700000000-uuid.pdf');
      expect(resolveInsideUploadRoot(dentro)).to.equal(path.resolve(dentro));
    });

    it('acepta un subdirectorio de la raiz', () => {
      const dentro = path.join(config.upload.proofsDir, 'anidado', 'uuid.png');
      expect(resolveInsideUploadRoot(dentro)).to.equal(path.resolve(dentro));
    });

    it('rechaza salir de la raiz con ..', () => {
      const fuera = path.join(config.upload.root, '..', 'package.json');
      expect(resolveInsideUploadRoot(fuera)).to.equal(null);
    });

    it('rechaza un archivo de otra parte del disco', () => {
      expect(resolveInsideUploadRoot(path.resolve('src/config/config.js'))).to.equal(null);
    });

    it('rechaza la propia raiz', () => {
      // La raiz es un directorio, no un archivo: aceptarla abriria la puerta a listar el disco.
      expect(resolveInsideUploadRoot(config.upload.root)).to.equal(null);
    });
  });

  describe('extensionForMime', () => {
    it('mapea los MIME permitidos a su extension', () => {
      expect(extensionForMime('application/pdf')).to.equal('.pdf');
      expect(extensionForMime('image/jpeg')).to.equal('.jpg');
      expect(extensionForMime('image/png')).to.equal('.png');
      expect(extensionForMime('image/xml')).to.equal('.xml');
    });

    it('devuelve cadena vacia para un MIME desconocido', () => {
      expect(extensionForMime('application/x-msdownload')).to.equal('');
    });
  });

  describe('crearUploader', () => {
    it('crea el destino si no existe', () => {
      // Un repo recien clonado no trae los subdirectorios de uploads.
      const destino = path.join(config.upload.root, 'probe-test');
      try {
        const uploader = crearUploader({
          destino,
          mimePermitidos: ['application/pdf'],
          limiteBytes: 1024
        });
        expect(uploader).to.have.property('single');
        expect(existsSync(destino)).to.equal(true);
      } finally {
        rmSync(destino, { recursive: true, force: true });
      }
    });
  });
});
