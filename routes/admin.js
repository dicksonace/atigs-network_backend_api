const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const mediaAlbumController = require('../controllers/mediaAlbumController');
const uploadController = require('../controllers/uploadController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Users per page
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */
router.get(
  '/users',
  authenticate,
  authorize('admin'),
  adminController.getAllUsers
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user/member by ID
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: User not found
 */
router.delete(
  '/users/:id',
  authenticate,
  authorize('admin'),
  adminController.deleteUser
);

router.get(
  '/content/:type',
  authenticate,
  authorize('admin'),
  adminController.getContentByType
);

router.post(
  '/content/:type',
  authenticate,
  authorize('admin'),
  adminController.createContent
);

router.put(
  '/content/:type/:id',
  authenticate,
  authorize('admin'),
  adminController.updateContent
);

router.delete(
  '/content/:type/:id',
  authenticate,
  authorize('admin'),
  adminController.deleteContent
);

router.get(
  '/payments/overview',
  authenticate,
  authorize('admin'),
  adminController.getAdminPaymentsOverview
);

router.get(
  '/members',
  authenticate,
  authorize('admin'),
  adminController.getMembersList
);

router.get(
  '/settings/exchange-rate',
  authenticate,
  authorize('admin'),
  adminController.getExchangeRateSetting
);

router.put(
  '/settings/exchange-rate',
  authenticate,
  authorize('admin'),
  adminController.updateExchangeRateSetting
);

router.get(
  '/membership-plans',
  authenticate,
  authorize('admin'),
  adminController.getMembershipPlansAdmin
);

router.post(
  '/membership-plans',
  authenticate,
  authorize('admin'),
  adminController.createMembershipPlanAdmin
);

router.put(
  '/membership-plans/:id',
  authenticate,
  authorize('admin'),
  adminController.updateMembershipPlanAdmin
);

router.delete(
  '/membership-plans/:id',
  authenticate,
  authorize('admin'),
  adminController.deleteMembershipPlanAdmin
);

router.get(
  '/media-albums',
  authenticate,
  authorize('admin'),
  mediaAlbumController.getMediaAlbumsAdmin
);

router.post(
  '/media-albums',
  authenticate,
  authorize('admin'),
  mediaAlbumController.createMediaAlbum
);

router.put(
  '/media-albums/:id',
  authenticate,
  authorize('admin'),
  mediaAlbumController.updateMediaAlbum
);

router.delete(
  '/media-albums/:id',
  authenticate,
  authorize('admin'),
  mediaAlbumController.deleteMediaAlbum
);

router.post(
  '/uploads/image',
  authenticate,
  authorize('admin'),
  ...uploadController.uploadContentImage
);

module.exports = router;
