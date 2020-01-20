import StoreList from '../storelist';
import { api } from '@/services/api';

let store = StoreList.create( api.blog, {ctl:1} );
export default {
    namespaced: true,...store
}
