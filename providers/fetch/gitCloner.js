// Copyright (c) Microsoft Corporation. All rights reserved.
// SPDX-License-Identifier: MIT

const BaseHandler = require('../../lib/baseHandler');
const { exec } = require('child_process');
const SourceSpec = require('../../lib/sourceSpec');

class GitCloner extends BaseHandler {

  canHandle(request) {
    const spec = this.toSpec(request);
    return request.type !== 'source' && spec && spec.type === 'git';
  }

  async handle(request) {
    const spec = this.toSpec(request);
    const sourceSpec = this._toSourceSpec(spec);
    const options = { version: sourceSpec.revision };
    const dir = this._createTempDir(request);

    const repoSize = await this._cloneRepo(sourceSpec.url, dir.name, spec.name, options.version);
    request.addMeta({ gitSize: repoSize });

    request.contentOrigin = 'origin';
    request.document = this._createDocument(dir.name + '/' + spec.name, repoSize);
    return request;
  }

  _createDocument(dir, size) {
    // Create a simple document that records the location and the size of the repo that was fetched
    return { location: dir, size };
  }

  _toSourceSpec(spec) {
    const url = `https://github.com/${spec.namespace}/${spec.name}.git`
    return new SourceSpec('git', 'github', url, spec.revision);
  }

  _cloneRepo(sourceUrl, dirName, specName, commit) {
    return new Promise((resolve, reject) => {
      exec(`cd ${dirName} && git clone ${sourceUrl} --quiet && cd ${specName} && git reset --hard ${commit} --quiet && git count-objects -v`, (error, stdout) => {
        if (error) {
          return reject(error);
        }
        resolve(this._getRepoSize(stdout));
      });
    });
  }

  _getRepoSize(gitCountObjectsResult = '') { // ...\nsize-pack: 3\n... (in KB)
    return Number(gitCountObjectsResult.match('size-pack: (.*)\n')[1]);
  }
}

module.exports = options => new GitCloner(options);