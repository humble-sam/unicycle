const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Sanitize HTML content to prevent XSS
const sanitizeHtml = (dirty) => {
  if (!dirty || typeof dirty !== 'string') {
    return dirty;
  }
  
  // Allow basic formatting but strip scripts and dangerous tags
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: []
  });
};

// Sanitize plain text (remove HTML entirely)
const sanitizeText = (dirty) => {
  if (!dirty || typeof dirty !== 'string') {
    return dirty;
  }
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

// Middleware to sanitize request body
const sanitizeBody = (req, res, next) => {
  if (req.body) {
    // Sanitize text fields
    if (req.body.title) {
      req.body.title = sanitizeText(req.body.title);
    }
    if (req.body.description) {
      req.body.description = sanitizeHtml(req.body.description);
    }
    if (req.body.full_name) {
      req.body.full_name = sanitizeText(req.body.full_name);
    }
    if (req.body.college) {
      req.body.college = sanitizeText(req.body.college);
    }
    if (req.body.phone) {
      req.body.phone = sanitizeText(req.body.phone);
    }
    if (req.body.reason) {
      req.body.reason = sanitizeText(req.body.reason);
    }
    if (req.body.flag_reason) {
      req.body.flag_reason = sanitizeText(req.body.flag_reason);
    }
    if (req.body.suspension_reason) {
      req.body.suspension_reason = sanitizeText(req.body.suspension_reason);
    }
  }
  
  next();
};

module.exports = {
  sanitizeHtml,
  sanitizeText,
  sanitizeBody
};
