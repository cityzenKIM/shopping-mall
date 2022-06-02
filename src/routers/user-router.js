import { Router } from "express";
import is from "@sindresorhus/is";
// 폴더에서 import하면, 자동으로 폴더의 index.js에서 가져옴
import { loginRequired } from "../middlewares";
import { userService } from "../services";
import { transPort } from "../config/email";

const userRouter = Router();

// 회원가입 할때 작성한 이메일로 인증코드가 담긴 메일 전송
userRouter.post("/mail", async (req, res, next) => {
  let authNum = Math.random().toString().substr(2, 6);
  const mailOptions = {
    from: "rhakdjfk@ajou.ac.kr",
    to: req.body.email,
    subject: "회원가입을 위해 인증번호를 입력해주세요.",
    text: "인증 코드입니다. " + authNum,
  };

  await transPort.sendMail(mailOptions, function (error, info) {
    console.log(mailOptions);
    if (error) {
      console.log(error);
    }
    console.log(info);
    // console.log("Finish sending email : " + info.response);
    res.send(authNum);
    transPort.close();
  });
});

// 회원가입 api (아래는 /register이지만, 실제로는 /api/register로 요청해야 함.)
userRouter.post("/register", async (req, res, next) => {
  try {
    // Content-Type: application/json 설정을 안 한 경우, 에러를 만들도록 함.
    // application/json 설정을 프론트에서 안 하면, body가 비어 있게 됨.
    if (is.emptyObject(req.body)) {
      throw new Error(
        "headers의 Content-Type을 application/json으로 설정해주세요"
      );
    }

    // req (request)의 body 에서 데이터 가져오기
    const { fullName, email, password } = req.body;

    // 위 데이터를 유저 db에 추가하기
    const newUser = await userService.addUser({
      fullName,
      email,
      password,
    });

    // 추가된 유저의 db 데이터를 프론트에 다시 보내줌
    // 물론 프론트에서 안 쓸 수도 있지만, 편의상 일단 보내 줌
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
});

// 로그인 api (아래는 /login 이지만, 실제로는 /api/login로 요청해야 함.)
userRouter.post("/login", async function (req, res, next) {
  try {
    // application/json 설정을 프론트에서 안 하면, body가 비어 있게 됨.
    if (is.emptyObject(req.body)) {
      throw new Error(
        "headers의 Content-Type을 application/json으로 설정해주세요"
      );
    }

    // req (request) 에서 데이터 가져오기
    const { email, password } = req.body;

    // 로그인 진행 (로그인 성공 시 jwt 토큰을 프론트에 보내 줌)
    const userToken = await userService.getUserToken({ email, password });
    // jwt 토큰을 프론트에 보냄 (jwt 토큰은, 문자열임)
    res.status(200).json(userToken);
  } catch (error) {
    next(error);
  }
});

// 내 정보 보기 api
userRouter.get("/my", loginRequired, async (req, res, next) => {
  try {
    const userId = req.currentUserId;
    let myInfo = await userService.getMyInfo(userId);
    const myInfoWithoutPwd = (({ password, ...o }) => o)(myInfo._doc);
    res.status(200).json(myInfoWithoutPwd);
  } catch (error) {
    next(error);
  }
});

// 내 판매 목록 보기 api
userRouter.get("/user/sellinglist", loginRequired, async (req, res, next) => {
  try {
    const userId = req.currentUserId;
    const mySellingInfo = await userService.getProductsByUserId(userId);
    res.status(200).json(mySellingInfo);
  } catch (error) {
    next(error);
  }
});

// 사용자 정보 수정
// (예를 들어 /api/users/abc12345 로 요청하면 req.params.userId는 'abc12345' 문자열로 됨)
userRouter.patch("/user", loginRequired, async function (req, res, next) {
  try {
    // content-type 을 application/json 로 프론트에서
    // 설정 안 하고 요청하면, body가 비어 있게 됨.
    if (is.emptyObject(req.body)) {
      throw new Error(
        "headers의 Content-Type을 application/json으로 설정해주세요"
      );
    }

    // token으로부터 id를 가져옴
    const userId = req.currentUserId;

    // body data 로부터 업데이트할 사용자 정보를 추출함.
    const fullName = req.body.fullName;
    const password = req.body.password;
    const address = req.body.address;
    const phoneNumber = req.body.phoneNumber;
    const role = req.body.role;

    // body data로부터, 확인용으로 사용할 현재 비밀번호를 추출함.
    const currentPassword = req.body.currentPassword;

    // currentPassword 없을 시, 진행 불가
    if (!currentPassword) {
      throw new Error("정보를 변경하려면, 현재의 비밀번호가 필요합니다.");
    }

    const userInfoRequired = { userId, currentPassword };

    // 위 데이터가 undefined가 아니라면, 즉, 프론트에서 업데이트를 위해
    // 보내주었다면, 업데이트용 객체에 삽입함.
    const toUpdate = {
      ...(fullName && { fullName }),
      ...(password && { password }),
      ...(address && { address }),
      ...(phoneNumber && { phoneNumber }),
      ...(role && { role }),
    };

    // 사용자 정보를 업데이트함.
    const updatedUserInfo = await userService.setUser(
      userInfoRequired,
      toUpdate
    );
    const userInfoWithoutPwd = (({ password, ...o }) => o)(
      updatedUserInfo._doc
    );
    // 업데이트 이후의 유저 데이터를 프론트에 보내 줌
    res.status(200).json(userInfoWithoutPwd);
  } catch (error) {
    next(error);
  }
});

userRouter.delete("/user", loginRequired, async function (req, res, next) {
  try {
    // content-type 을 application/json 로 프론트에서
    // 설정 안 하고 요청하면, body가 비어 있게 됨.
    if (is.emptyObject(req.body)) {
      throw new Error(
        "headers의 Content-Type을 application/json으로 설정해주세요"
      );
    }
    const userId = req.currentUserId;
    console.log(userId);
    // body data로부터, 확인용으로 사용할 현재 비밀번호를 추출함.
    const { currentPassword } = req.body;

    // currentPassword 없을 시, 진행 불가
    if (!currentPassword) {
      throw new Error("회원 탈퇴를 위해, 비밀번호를 입력해주세요.");
    }
    const userInfoRequired = { userId, currentPassword };
    // 사용자 정보를 업데이트함.
    const deleteUserInfo = await userService.deleteUser(userInfoRequired);
    const userInfoWithoutPwd = (({ password, ...o }) => o)(deleteUserInfo._doc);
    // 업데이트 이후의 유저 데이터를 프론트에 보내 줌
    res.status(200).json(userInfoWithoutPwd);
  } catch (error) {
    next(error);
  }
});

export { userRouter };
