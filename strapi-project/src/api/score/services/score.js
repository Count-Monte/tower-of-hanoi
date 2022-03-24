'use strict';

/**
 * score service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::score.score');
