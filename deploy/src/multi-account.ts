import * as _ from "lodash";
import * as nconf from "nconf";
import { config, getBaseConfig, execute } from "./deploy";
import { readFileSync } from "fs";

const parse = require("csv-parse/lib/sync");

async function main() {
  const credentialsPath = config.get("aws-credentials-path");
  const csv = parse(readFileSync(credentialsPath).toString(), { columns: true })[0];

  const credentials = {
    accessKeyId: csv["Access key ID"],
    secretAccessKey: csv["Secret access key"]
  };

  const accountId = credentialsPath.match(/_(\d+)_/)[1];
  const bucketName = `orbs-network-${accountId}-config`;

  const regions = config.get("region").split(",");

  for (const region of regions) {
    // TODO: fix staging
    const secretBlockKey = `${__dirname}/test-keys/orbs-global-${accountId}-staging-${region}-secret-block-key`;
    const secretMessageKey = `${__dirname}/test-keys/orbs-global-${accountId}-staging-${region}-secret-message-key`;

    const regionalConfig = _.extend({}, getBaseConfig(), {
      credentials,
      accountId,
      region,
      bucketName,
      secretBlockKey,
      secretMessageKey
    });

    await execute(regionalConfig);
  }
}

main();
