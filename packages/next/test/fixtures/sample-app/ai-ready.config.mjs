export default {
  site: {
    name: "Sample",
    baseUrl: "https://sample.test",
    description: "Sample app for testing the build pipeline.",
  },
  content: ["content/**/*.mdx"],
  llms: {
    sections: [
      { title: "Guides", include: "/docs/**", priority: "high" },
    ],
  },
};
