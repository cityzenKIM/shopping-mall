import { Router } from "express";
import is from "@sindresorhus/is";
// 폴더에서 import하면, 자동으로 폴더의 index.js에서 가져옴
import { loginRequired } from "../middlewares";
import { productService } from "../services";
import { upload } from "../middlewares";
const productRouter = Router();

// 전체 상품 가져오기
productRouter.get("/list", async function (req, res, next) {
  try {
    // 전체 사용자 목록을 얻음
    const products = await productService.getProducts();
    // 사용자 목록(배열)을 JSON 형태로 프론트에 보냄
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
});

//상품 상세 페이지
productRouter.get("/:productId", async function (req, res, next) {
  try {
    const productId = req.params.productId;
    const productInfo = await productService.getProductById(productId);
    // 상품 스키마를 JSON 형태로 프론트에 보냄
    res.status(200).json(productInfo);
  } catch (error) {
    next(error);
  }
});

//상품 수정 위해 상품 데이터 보내기
productRouter.get("/:productId/update", async function (req, res, next) {
  try {
    const productId = req.params.productId;
    const productInfo = await productService.getProductById(productId);
    // 상품 스키마를 JSON 형태로 프론트에 보냄
    res.status(200).json(productInfo);
  } catch (error) {
    next(error);
  }
});

productRouter.patch(
  "/:productId/update",
  upload.single("image-file"),
  async function (req, res, next) {
    try {
      if (is.emptyObject(req.body)) {
        throw new Error(
          "headers의 Content-Type을 application/json으로 설정해주세요"
        );
      }

      const productId = req.params.id;
      const img = req.file.location;
      const name = req.body.name;
      const price = req.body.price;
      const category = req.body.category;
      const quantity = req.body.quantity;
      const size = req.body.size;
      const brandName = req.body.brandName;
      const keyword = req.body.keyword;
      const shortDescription = req.body.shortDescription;
      const detailDescription = req.body.detailDescription;

      const toUpdate = {
        ...(img && { img }),
        ...(name && { name }),
        ...(price && { price }),
        ...(category && { category }),
        ...(quantity && { quantity }),
        ...(size && { size }),
        ...(brandName && { brandName }),
        ...(keyword && { keyword }),
        ...(shortDescription && { shortDescription }),
        ...(detailDescription && { detailDescription }),
      };

      // 사용자 정보를 업데이트함.
      const updatedProductInfo = await productService.setProduct(
        productId,
        toUpdate
      );
      res.status(200).json(updatedProductInfo);
    } catch (error) {
      next(error);
    }
  }
);

// 상품 업로드 api
productRouter.post(
  "/add",
  upload.single("image-file"),
  async (req, res, next) => {
    try {
      if (is.emptyObject(req.body)) {
        throw new Error(
          "headers의 Content-Type을 application/json으로 설정해주세요"
        );
      }

      const img = req.file.location;

      const name = req.body.name;
      const price = req.body.price;
      const category = req.body.category;
      const quantity = req.body.quantity;
      const size = req.body.size;
      const brandName = req.body.brandName;
      const keyword = req.body.keyword;
      const shortDescription = req.body.shortDescription;
      const detailDescription = req.body.detailDescription;

      console.log(name);

      // 위 데이터를 유저 db에 추가하기
      const newProduct = await productService.addProduct({
        name,
        price,
        img,
        category,
        quantity,
        size,
        brandName,
        keyword,
        shortDescription,
        detailDescription,
      });

      // 추가된 유저의 db 데이터를 프론트에 다시 보내줌
      // 물론 프론트에서 안 쓸 수도 있지만, 편의상 일단 보내 줌
      res.status(201).json(newProduct);
    } catch (error) {
      next(error);
    }
  }
);

// 카테고리에 맞는 상품 api
productRouter.get("/list/category/:category", async (req, res, next) => {
  try {
    const category = req.params.category;
    // 특정 카테고리에 맞는 상품 목록을 얻음
    const products = await productService.getProductsByCategory(category);
    // 상품 목록(배열)을 JSON 형태로 프론트에 보냄
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
});

export { productRouter };