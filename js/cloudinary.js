const CLOUD_NAME = "comixall";
const API_KEY = "149832968147137";
const API_SECRET = "2NLGLF4-dlXRX3xgt8AsbBf1CY0";

function getCloudinaryImageUrl(
  folder,
  imageName,
  width = 600,
  quality = "auto"
) {
  const transformations = `w_${width},q_${quality},f_auto`;
  const imagePath = imageName.includes(".") ? imageName : `${imageName}.jpg`;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformations}/${folder}/${imagePath}`;
}

function getFirstImageUrl(folderPath) {
  return getCloudinaryImageUrl(folderPath, "part1_image_1", 300);
}

window.cloudinary = {
  getImageUrl: getCloudinaryImageUrl,
  getFirstImageUrl,
};