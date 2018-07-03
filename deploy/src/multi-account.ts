import * as _ from "lodash";
import * as nconf from "nconf";
import { config, getBaseConfig, execute } from "./deploy";
import { readFileSync } from "fs";

const parse = require("csv-parse/lib/sync");

function parseCredentials(path: string): any {
  try {
    const csv = parse(readFileSync(path).toString(), { columns: true })[0];

    const credentials = {
      accessKeyId: csv["Access key ID"],
      secretAccessKey: csv["Secret access key"]
    };

    return credentials;
  }
  catch (e) {
    console.warn(`WARNING: Could not find credentials, proceeding without them`);
  }
}

async function main() {
  const credentialsPath = config.get("aws-credentials-path");
  const credentials = parseCredentials(credentialsPath);

  if (credentialsPath && config.get("aws-credentials-export")) {
    console.log(`export AWS_ACCESS_KEY_ID=${credentials.accessKeyId} AWS_SECRET_ACCESS_KEY=${credentials.secretAccessKey}`);
    process.exit();
  }

  const accountId = process.env.AWS_ACCOUNT_ID || credentialsPath.match(/_(\d+)_/)[1];
  const bucketName = process.env.S3_BUCKET_NAME || `orbs-network-${accountId}-config`;

  const regions = config.get("region").split(",");

  const privateKeysPath = nconf.get("private-keys") ? nconf.get("private-keys") : `${__dirname}/../temp-keys/private-keys`;

  for (const region of regions) {
    const baseConfig = getBaseConfig();

    // TODO: fix staging
    const secretMessageKey = `${privateKeysPath}/message/orbs-global-${accountId}-${baseConfig.NODE_ENV}-${region}`;
    const secretBlockKey = `${privateKeysPath}/block/orbs-global-${accountId}-${baseConfig.NODE_ENV}-${region}`;

    const regionalConfig = _.extend({}, baseConfig, {
      credentials,
      accountId,
      region,
      bucketName,
      secretMessageKey,
      secretBlockKey
    });

    await execute(regionalConfig);
  }
}

main();
