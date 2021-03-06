var async = require('async'),
	expect = require('chai').expect,
	xlrd = require('../lib/xlrd'),
	sampleFiles = [
		// OO XML workbook (Excel 2003 and later)
		'tests/sample.xlsx',
		// Legacy binary format (before Excel 2003)
		'tests/sample.xls'
	];

describe('xlrd', function () {
	describe('parse()', function () {

		it('should load a workbook/sheet/row/cell structure', function (done) {
			async.eachSeries(sampleFiles, function (file, next) {
				xlrd.parse(file, function (err, workbook) {

					if (err) throw err;

					expect(workbook).not.be.null;
					expect(workbook.file).to.equal(file);
					expect(workbook.meta.user).to.equal('Nicolas Mercier-Gaboury');
					expect(workbook.meta.sheets.count).to.equal(2);
					expect(workbook.meta.sheets.names).to.contain('Sheet1').and.to.contain('second sheet');
					expect(workbook.sheets).to.be.an('array').and.have.length(workbook.meta.sheets.count);

					workbook.sheets.forEach(function (sheet, index) {
						expect(sheet).to.have.property('index', index);
						expect(sheet).to.have.property('name', index === 0 ? 'Sheet1' : 'second sheet');
						expect(sheet).to.have.property('bounds').and.to.be.an('object');
						expect(sheet).to.have.property('visibility', 'visible');
						expect(sheet).to.have.property('rows').and.have.length(sheet.bounds.rows);
						expect(sheet).to.equal(workbook.sheets[index]).and.to.equal(workbook.sheets[sheet.name]);

						if (index === 0) {
							expect(sheet.bounds).to.have.property('columns', 5);
							expect(sheet.bounds).to.have.property('rows', 51);
						} else if (index === 1) {
							expect(sheet.bounds).to.have.property('columns', 3);
							expect(sheet.bounds).to.have.property('rows', 1384);
						}

						sheet.rows.forEach(function (row) {
							expect(row).to.be.an('array').and.have.length(sheet.bounds.columns);
							expect(row).to.have.deep.property('[0].row');
							expect(row).to.have.deep.property('[0].column');
							expect(row).to.have.deep.property('[0].address');
							expect(row).to.have.deep.property('[0].value');
						});
					});

					return next();
				});
			}, done);
		});

		it('should parse cell addresses', function (done) {
			async.eachSeries(sampleFiles, function (file, next) {
				xlrd.parse(file, function (err, workbook) {

					if (err) throw err;

					var rows = workbook.sheets[0].rows;
					expect(rows[0][0]).to.have.property('address', 'A1');
					expect(rows[0][4]).to.have.property('address', 'E1');
					expect(rows[5][0]).to.have.property('address', 'A6');
					expect(rows[5][4]).to.have.property('address', 'E6');
					expect(rows[50][0]).to.have.property('address', 'A51');
					expect(rows[50][4]).to.have.property('address', 'E51');

					return next();
				});
			}, done);
		});

		it('should parse numeric values', function (done) {
			async.eachSeries(sampleFiles, function (file, next) {
				xlrd.parse(file, function (err, workbook) {

					if (err) throw err;

					var row1 = workbook.sheets[0].rows[1],
						row2 = workbook.sheets[0].rows[2],
						row3 = workbook.sheets[0].rows[3],
						row4 = workbook.sheets[0].rows[4],
						row5 = workbook.sheets[0].rows[5];

					[row1, row2, row3, row4, row5].forEach(function (row) {
						expect(row[0].value).to.be.a('number');
						expect(row[1].value).to.be.a('number');
					})

					expect(row1[0].value).to.equal(1);
					expect(row1[1].value).to.equal(1.0001);
					expect(row2[0].value).to.equal(2);
					expect(row2[1].value).to.equal(2);
					expect(row3[0].value).to.equal(3);
					expect(row3[1].value).to.equal(3.00967676764465);
					expect(row4[0].value).to.equal(4);
					expect(row4[1].value).to.equal(0);
					expect(row5[0].value).to.equal(5);
					expect(row5[1].value).to.equal(5.00005);

					return next();
				});
			}, done);
		});

		it('should parse string values', function (done) {
			async.eachSeries(sampleFiles, function (file, next) {
				xlrd.parse(file, function (err, workbook) {

					if (err) throw err;

					var cell1 = workbook.sheets[0].rows[1][2],
						cell2 = workbook.sheets[0].rows[2][2],
						cell3 = workbook.sheets[0].rows[3][2],
						cell4 = workbook.sheets[0].rows[4][2],
						cell5 = workbook.sheets[0].rows[5][2];

					[cell1, cell2, cell3, cell4, cell5].forEach(function (cell) {
						expect(cell.value).to.be.a('string');
					});

					expect(cell1.value).to.equal('Some text');
					expect(cell2.value).to.equal('{ "property": "value" }');
					expect(cell3.value).to.equal('ÉéÀàçÇùÙ');
					expect(cell4.value).to.equal('some "quoted" text');
					expect(cell5.value).to.equal('more \'quoted\' "text"');

					return next();
				});
			}, done);
		});

		it('should parse date values', function (done) {
			async.eachSeries(sampleFiles, function (file, next) {
				xlrd.parse(file, function (err, workbook) {

					if (err) throw err;

					var row1 = workbook.sheets[0].rows[1],
						row2 = workbook.sheets[0].rows[2],
						row3 = workbook.sheets[0].rows[3],
						row4 = workbook.sheets[0].rows[4],
						row5 = workbook.sheets[0].rows[5];

					[row1, row2, row3, row4, row5].forEach(function (row) {
						expect(row[3].value).to.be.a('date');
						expect(row[4].value).to.be.a('date');
					});

					expect(row1[3].value).to.eql(new Date(2013, 0, 1, 0, 0, 0));
					expect(row1[4].value).to.eql(new Date(2013, 0, 1, 12, 54, 21));
					expect(row2[3].value).to.eql(new Date(2013, 0, 2, 0, 0, 0));
					//expect(row2[4].value).to.eql(new Date(0, 0, 0, 0, 0, 34));
					expect(row3[4].value).to.eql(new Date(2013, 0, 3, 3, 45, 20));
					expect(row4[4].value).to.eql(new Date(2013, 0, 4, 0, 0, 0));
					expect(row5[4].value).to.eql(new Date(2013, 0, 5, 16, 0, 0));

					return next();
				});
			}, done);
		});

		it('should fail if the file does not exist', function (done) {
			xlrd.parse('unknown.xlsx', function (err, workbook) {
				expect(workbook).to.not.be.ok;
				expect(err).to.be.an.instanceof(Error).and.have.property('type', 'file_not_found');
				return done();
			});
		});

		it('should fail if the file is not a valid workbook', function (done) {
			xlrd.parse('package.json', function (err, workbook) {
				expect(workbook).to.not.be.ok;
				expect(err).to.be.an.instanceof(Error).and.have.property('type', 'open_failed');
				return done();
			});
		});
	});

	describe('stream()', function () {

		it('should emit a single "open" event when file is ready', function (done) {
			async.eachSeries(sampleFiles, function (file, next) {
				xlrd.stream(file).on('open', function (workbook) {
					expect(workbook).to.be.an('object').and.have.property('file', file);
					return next();
				}).on('error', function (err) {
					throw err;
				});
			}, done);
		});

		it('should emit "data" events as data is being received', function (done) {
			async.eachSeries(sampleFiles, function (file, next) {

				var events = [],
					total = {};

				xlrd.stream(file).on('data',function (data) {
					events.push(data);
				}).on('error',function (err) {
					throw err;
				}).on('close', function () {

					expect(events).to.have.length.above(0);
					expect(events).to.have.deep.property('[0].workbook').and.have.property('file', file);
					expect(events).to.have.deep.property('[0].sheet');
					expect(events).to.have.deep.property('[0].rows').and.have.length.above(0);

					events.forEach(function (data) {
						total[data.sheet.name] = (total[data.sheet.name] || 0) + data.rows.length;
					});

					expect(total['Sheet1']).to.equal(51);
					expect(total['second sheet']).to.equal(1384);

					return next();
				});

			}, done);
		});
	});
});
