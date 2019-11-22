import StoreList from '../storelist';
import { api } from '@/services/api';

let store = StoreList.create( api.log );
export default {
    namespaced: true,...store
}
