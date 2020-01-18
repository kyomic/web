import IDataProvider from './IDataProvider'
class BufferProvider extends IDataProvider{
	constructor( observer ){
		super(observer)
	}
}
export default BufferProvider
export { BufferProvider }