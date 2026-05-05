export const calculateClayUsage = (volume, density, wasteFactor) => {
    // Your snippet logic here
    return (volume * density) * (1 + wasteFactor);
};