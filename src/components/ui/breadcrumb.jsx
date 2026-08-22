var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
import { jsx, jsxs } from "react/jsx-runtime";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
function Breadcrumb(_a) {
  var props = __objRest(_a, []);
  return /* @__PURE__ */ jsx("nav", __spreadValues({ "aria-label": "breadcrumb", "data-slot": "breadcrumb" }, props));
}
function BreadcrumbList(_b) {
  var _c = _b, { className } = _c, props = __objRest(_c, ["className"]);
  return /* @__PURE__ */ jsx(
    "ol",
    __spreadValues({
      "data-slot": "breadcrumb-list",
      className: cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
        className
      )
    }, props)
  );
}
function BreadcrumbItem(_d) {
  var _e = _d, { className } = _e, props = __objRest(_e, ["className"]);
  return /* @__PURE__ */ jsx(
    "li",
    __spreadValues({
      "data-slot": "breadcrumb-item",
      className: cn("inline-flex items-center gap-1.5", className)
    }, props)
  );
}
function BreadcrumbLink(_f) {
  var _g = _f, {
    asChild,
    className
  } = _g, props = __objRest(_g, [
    "asChild",
    "className"
  ]);
  const Comp = asChild ? Slot : "a";
  return /* @__PURE__ */ jsx(
    Comp,
    __spreadValues({
      "data-slot": "breadcrumb-link",
      className: cn("hover:text-foreground transition-colors", className)
    }, props)
  );
}
function BreadcrumbPage(_h) {
  var _i = _h, { className } = _i, props = __objRest(_i, ["className"]);
  return /* @__PURE__ */ jsx(
    "span",
    __spreadValues({
      "data-slot": "breadcrumb-page",
      role: "link",
      "aria-disabled": "true",
      "aria-current": "page",
      className: cn("text-foreground font-normal", className)
    }, props)
  );
}
function BreadcrumbSeparator(_j) {
  var _k = _j, {
    children,
    className
  } = _k, props = __objRest(_k, [
    "children",
    "className"
  ]);
  return /* @__PURE__ */ jsx(
    "li",
    __spreadProps(__spreadValues({
      "data-slot": "breadcrumb-separator",
      role: "presentation",
      "aria-hidden": "true",
      className: cn("[&>svg]:size-3.5", className)
    }, props), {
      children: children != null ? children : /* @__PURE__ */ jsx(ChevronRight, {})
    })
  );
}
function BreadcrumbEllipsis(_l) {
  var _m = _l, {
    className
  } = _m, props = __objRest(_m, [
    "className"
  ]);
  return /* @__PURE__ */ jsxs(
    "span",
    __spreadProps(__spreadValues({
      "data-slot": "breadcrumb-ellipsis",
      role: "presentation",
      "aria-hidden": "true",
      className: cn("flex size-9 items-center justify-center", className)
    }, props), {
      children: [
        /* @__PURE__ */ jsx(MoreHorizontal, { className: "size-4" }),
        /* @__PURE__ */ jsx("span", { className: "sr-only", children: "More" })
      ]
    })
  );
}
export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
};
