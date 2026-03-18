export default defineAppConfig({
  ui: {
    colors: {
      neutral: "zinc",
      filter: "indigo",
    },
    button: {
      slots: {
        base: "cursor-pointer",
      },
    },
    slideover: {
      variants: {
        side: {
          right: {
            content: "max-w-2xl",
          },
          left: {
            content: "max-w-2xl",
          },
        },
      },
    },
  },
});
