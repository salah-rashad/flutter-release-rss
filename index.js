const xml = require("xml");
const { mkdir, writeFile } = require("fs/promises");

const baseUrl = "https://storage.googleapis.com/flutter_infra_release/releases";

const query = ["windows", "macos", "linux"];

async function fetchRelease(os) {
  const response = await fetch(`${baseUrl}/releases_${os}.json`);
  const data = await response.json();
  const releases = data["releases"];
  const result = [];
  for (const release of releases) {
    result.push({
      item: [
        {
          description: `*Flutter \`v${release["version"]}\` has been released*\n\n\`\`\`Hash:\t\t${release["hash"]}\nDart SDK:\t${release["dart_sdk_version"]}\`\`\`\n\n<https://docs.flutter.dev/release/release-notes/release-notes-${release["version"]}|Release Notes>`,
        },
        {
          pubDate: release["release_date"],
        },
      ],
    });
  }
  return result;
}

function buildRss(os, items) {
  const rss = [
    {
      rss: [
        { _attr: { version: "2.0" } },
        {
          channel: [
            {
              title: `Flutter releases for ${os}`,
            },
            {
              link: "https://docs.flutter.dev/release/release-notes",
            },
            {
              description: "",
            },
            {
              lastBuildDate: new Date().toISOString(),
            },
            ...items,
          ],
        },
      ],
    },
  ];
  return xml(rss, { declaration: true });
}

(async function () {
  try {
    await mkdir("dist");
  } catch (e) {
    if (e.code !== "EEXIST") {
      throw e;
    }
  }
  for (const e of query) {
    const items = await fetchRelease(e);
    const result = buildRss(e, items);
    await writeFile(`dist/releases_${e}.xml`, result);
  }
})();
