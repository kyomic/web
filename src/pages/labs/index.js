export {labs_index} from './labs_index.vue'

let pages = {}

pages["color"] = require('./labs_color.vue');
pages["image_rgb"] = require('./labs_image_rgb.vue');
pages["image_filter"] = require('./labs_image_filter.vue');
pages["image_blender"] = require('./labs_image_blender.vue');
export {
	pages
}