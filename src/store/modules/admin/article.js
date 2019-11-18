import StoreList from '../storelist';
import { api } from '@/services/api';

let store = StoreList.create( api.blog );
export default {
    namespaced: true,...store
}
