import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

import uploadConfig from '../config/upload';

async function loadCSV(fileName: string): Promise<Array<string[]>> {
  const csvStream = fs.createReadStream(
    path.resolve(uploadConfig.directory, fileName),
  );

  const parseStream = csvParse({
    from_line: 2,
    ltrim: true,
    rtrim: true,
  });

  const parseCSV = csvStream.pipe(parseStream);

  const lines: Array<string[]> = [];
  parseCSV.on('data', async line => {
    lines.push(line);
  });

  await new Promise(resolve => parseCSV.on('end', resolve));
  await fs.promises.unlink(path.join(uploadConfig.directory, fileName));

  return lines;
}
class ImportTransactionsService {
  async execute(fileName: string): Promise<Transaction[]> {
    const createTransaction = new CreateTransactionService();

    const csvArray = await loadCSV(fileName);

    const transactions: Transaction[] = [];

    await csvArray.reduce(async (promise, line) => {
      const [title, type, value, category] = line;

      await promise;

      const transaction = await createTransaction.execute({
        title,
        type: type as Transaction['type'],
        value: parseInt(value, 10),
        categoryTitle: category,
      });

      transactions.push(transaction);
    }, Promise.resolve());

    return transactions;
  }
}

export default ImportTransactionsService;
