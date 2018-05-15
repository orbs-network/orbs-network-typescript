import * as _ from "lodash";
import * as nconf from "nconf";
import { config, getBaseConfig, execute } from "./deploy";
import { readFileSync } from "fs";

const parse = require("csv-parse/lib/sync");

function parseCredentials(path: string) {
  try {
    const csv = parse(readFileSync(path).toString(), { columns: true })[0];

    const credentials = {
      accessKeyId: csv["Access key ID"],
      secretAccessKey: csv["Secret access key"]
    };
  }
  catch (e) {
    console.warn(`WARNING: Could not find credentials, proceeding without them`);
  }
}

async function main() {
  const credentialsPath = config.get("aws-credentials-path");
  const credentials = parseCredentials(credentialsPath);

  const accountId = process.env.AWS_ACCOUNT_ID || credentialsPath.match(/_(\d+)_/)[1];
  const bucketName = process.env.S3_BUCKET_NAME || `orbs-network-${accountId}-config`;

  const regions = config.get("region").split(",");

  for (const region of regions) {
    // TODO: fix staging
    const secretMessageKey = `${__dirname}/../temp-keys/private-keys/message/orbs-global-${accountId}-staging-${region}`;
    const secretBlockKey = `${__dirname}/../temp-keys/private-keys/block/orbs-global-${accountId}-staging-${region}`;

    const regionalConfig = _.extend({}, getBaseConfig(), {
      credentials,
      accountId,
      region,
      bucketName,
      secretMessageKey
    });

    await execute(regionalConfig);
  }
}

main();
