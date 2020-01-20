export {labs_index} from './labs_index.vue'

let pages = {}

pages["index"] = require('./labs_index');
pages["bytearray"] = require('./labs_bytearray.vue');
pages["color"] = require('./labs_color.vue');
pages["image_rgb"] = require('./labs_image_rgb.vue');
pages["image_filter"] = require('./labs_image_filter.vue');

pages["image_filter_convolution"] = require('./labs_image_filter_convolution.vue');
pages["image_blender"] = require('./labs_image_blender.vue');

pages["color_ui"] = require('./labs_color_ui.vue');
//pages["media_video"] = require('./labs_media_video.vue');
export {
	pages
}