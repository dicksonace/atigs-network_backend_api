/**
 * @swagger
 * tags:
 *   name: Code Verification
 *   description: Code verification endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CodeVerificationRequest:
 *       type: object
 *       required:
 *         - code
 *       properties:
 *         code:
 *           type: string
 *           description: The code to verify
 *           example: "123456"
 *     CodeVerificationResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the code is valid
 *           example: true
 *         message:
 *           type: string
 *           description: Response message
 *           example: "Code verified successfully"
 */

/**
 * @swagger
 * /api/code/verify:
 *   post:
 *     summary: Verify a code
 *     tags: [Code Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CodeVerificationRequest'
 *     responses:
 *       200:
 *         description: Code verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CodeVerificationResponse'
 *       400:
 *         description: Invalid code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid code"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
exports.verifyCode = async (req, res) => {
  try {
    const { code } = req.body;

    // Validate input
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Code is required"
      });
    }

    // Hardcoded codes array - update this with actual codes
    const validCodes = ["123456", "78094"];

    // Check if the provided code matches any in the array
    if (validCodes.includes(code)) {
      return res.status(200).json({
        success: true,
        message: "Code verified successfully"
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid code"
      });
    }
  } catch (error) {
    console.error("Code verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};