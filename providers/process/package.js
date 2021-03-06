// Copyright (c) Microsoft Corporation. All rights reserved.
// SPDX-License-Identifier: MIT

const BaseHandler = require('../../lib/baseHandler');

class PackageProcessor extends BaseHandler {

  get schemaVersion() {
    return 1;
  }

  get toolSpec() {
    return { tool: 'clearlydescribed', toolVersion: this.schemaVersion };
  }

  shouldFetch(request) {
    return false;
  }

  canHandle(request) {
    const spec = this.toSpec(request);
    return request.type === 'package' && spec && ['npm'].includes(spec.type);
  }

  handle(request) {
    const { document, spec } = super._process(request);
    this.addBasicToolLinks(request, spec);
    this.linkAndQueueTool(request, spec.type);
    request.markNoSave();
    return request;
  }
}

module.exports = options => new PackageProcessor(options);