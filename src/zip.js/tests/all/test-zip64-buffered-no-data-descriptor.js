/* global Blob */

import * as zip from "../../index.js";

const TEXT_CONTENT = "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Nam liber tempor cum soluta nobis eleifend option congue nihil imperdiet doming id quod mazim placerat facer possim assum. Typi non habent claritatem insitam; est usus legentis in iis qui facit eorum claritatem. Investigationes demonstraverunt lectores legere me lius quod ii legunt saepius. Claritas est etiam processus dynamicus, qui sequitur mutationem consuetudium lectorum. Mirum est notare quam littera gothica, quam nunc putamus parum claram, anteposuerit litterarum formas humanitatis per seacula quarta decima et quinta decima. Eodem modo typi, qui nunc nobis videntur parum clari, fiant sollemnes in futurum.";
const FILENAME = "lorem.txt";
const BLOB = new Blob([TEXT_CONTENT], { type: zip.getMimeType(FILENAME) });

export { test };

async function test() {
	zip.configure({ chunkSize: 128, useWebWorkers: true });
	let blobWriter = new zip.BlobWriter("application/zip");
	let zipWriter = new zip.ZipWriter(blobWriter, { zip64: true, dataDescriptor: false, bufferedWrite: true });
	await zipWriter.add(FILENAME, new zip.BlobReader(BLOB));
	const zipNoDataDescriptor = await zipWriter.close();
	const zipReader = new zip.ZipReader(new zip.BlobReader(await blobWriter.getData()));
	const entries = await zipReader.getEntries();
	const data = await entries[0].getData(new zip.BlobWriter(zip.getMimeType(entries[0].filename)));
	blobWriter = new zip.BlobWriter("application/zip");
	zipWriter = new zip.ZipWriter(blobWriter, { zip64: true, dataDescriptor: true, bufferedWrite: true });
	await zipWriter.add(FILENAME, new zip.BlobReader(BLOB));
	const zipDataDescriptor = await zipWriter.close();
	await zip.terminateWorkers();
	if (TEXT_CONTENT != await data.text() || !entries[0].zip64 || entries[0].uncompressedSize != TEXT_CONTENT.length || zipNoDataDescriptor.size >= zipDataDescriptor.size) {
		throw new Error();
	}
}