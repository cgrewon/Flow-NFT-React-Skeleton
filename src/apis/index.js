import axios from "axios";
export const Host = process.env.REACT_APP_API_HOST;

const HttpReq = async (url, method = "GET", token, data) => {
  const headers = { Accept: "application/json" };

  if (token) {
    headers.Authorization = "Bearer " + token;
  }
  try {
    const res = await axios({
      url,
      method: method,
      headers,
      data,
    });
    return res;
  } catch (ex) {
    return {
      status: -500,
      error: "Connection failed, please try again after check your connection.",
      errorDetail: ex,
    };
  }
};

const HttpGet = async (url, token) => {
  return await HttpReq(url, "GET", token);
};

const HttpPost = async (url, token, data) => {
  return await HttpReq(url, "POST", token, data);
};

const HttpDelete = async (url, token, data) => {
  return await HttpReq(url, "DELETE", token, data);
};


export const Api = {
  
  // getCollectionSlugs: async (count = 20) => {
  //   const url = `${Host}nft/basic/collections?count=${count}`;
  //   const res = await HttpGet(url);
  //   if (res.data) {
  //     return res.data;
  //   } else {
  //     return {
  //       status: 500,
  //       error: "Failed to get collection data. please refresh page again.",
  //     };
  //   }
  // },

  mintReq: async (address, cidMetadataLink) => {
    const url = `${Host}user/mine_req`;
    const data = {
      address: address,
      cidMetadataLink
    };
    const res = await HttpPost(url, null, data);
    if (res.data) {
      if (res.data.status === 200) {
        const lastNftId = res.data.data ? res.data.data.id : null;
        return {
          status: 200,
          lastNftId: lastNftId
        };
      } else {
        const error = res.data && res.data.error
          ? res.data.error.message
          : "Failed to send mint request. please try after a moment";
        return {
          status: 400,
          error,
        };
      } 
    }else{
      return {
        status: 400,
        error: "Connection error please try after check connection.",
      };
    }

  },

 
};
