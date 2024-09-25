export const getSavageAppBaseURL = (shop)=>{
    if(!shop || shop == ""){
        const error = new Error();
        error.status = 404;
        error.message = "Failed to create shopify app bse url.";
        return error;
    }

    let filterShop = shop.replace(".myshopify.com", "");

    let baseUrl = `https://admin.shopify.com/store/${filterShop}/apps/savage-app`

    return baseUrl;
}