import { defineComponents } from "blume";
import LectureList from "./components/LectureList.astro";
import PageHeader from "./components/PageHeader.astro";

export default defineComponents({
  mdx: {
    LectureList,
  },
  layout: {
    PageHeader,
  },
});
