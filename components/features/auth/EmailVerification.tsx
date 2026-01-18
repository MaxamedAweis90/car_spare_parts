import React, { useState } from "react";
import {
  Alert,
  Box,
  TextField,
  TextFieldProps,
  Button,
  Snackbar,
} from "@mui/material";

interface EmailVerificationFieldProps
  extends Omit<TextFieldProps, "error" | "helperText"> {
  isVerified?: boolean;
  showVerificationStatus?: boolean;
  onResendVerification?: () => Promise<void>;
}

export const EmailVerificationField: React.FC<EmailVerificationFieldProps> = ({
  isVerified,
  showVerificationStatus = true,
  onResendVerification,
  ...textFieldProps
}) => {
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const needsVerification = showVerificationStatus && isVerified === false;

  const handleResend = async () => {
    if (!onResendVerification) return;

    setResending(true);
    setResendMessage(null);

    try {
      await onResendVerification();
      setResendMessage({
        type: "success",
        text: "Verification email sent! Please check your inbox.",
      });
    } catch (error: any) {
      setResendMessage({
        type: "error",
        text: error.message || "Failed to send email",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <Box>
      <TextField
        {...textFieldProps}
        type="email"
        error={needsVerification}
        sx={{
          ...textFieldProps.sx,
          ...(needsVerification && {
            "& .MuiOutlinedInput-root": {
              backgroundColor: "rgba(255, 152, 0, 0.05)",
              "& fieldset": {
                borderColor: "warning.main",
                borderWidth: 2,
              },
            },
          }),
        }}
      />

      {needsVerification && (
        <Alert
          severity="warning"
          variant="outlined"
          icon={
            <i
              className="fa-solid fa-envelope-circle-check"
              style={{ fontSize: 20 }}
            ></i>
          }
          sx={{
            mt: 1.5,
            borderRadius: 2,
            "& .MuiAlert-message": {
              fontSize: "0.875rem",
              width: "100%",
            },
          }}
          action={
            onResendVerification && (
              <Button
                color="warning"
                size="small"
                onClick={handleResend}
                disabled={resending}
                sx={{
                  fontWeight: 700,
                  textTransform: "none",
                  minWidth: "auto",
                  whiteSpace: "nowrap",
                }}
              >
                {resending ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-1"></i>{" "}
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane mr-1"></i> Resend
                    Email
                  </>
                )}
              </Button>
            )
          }
        >
          <Box>
            <strong>Email Not Verified</strong>
            <Box
              component="span"
              sx={{
                display: "block",
                fontSize: "0.8125rem",
                mt: 0.5,
                opacity: 0.9,
              }}
            >
              Check your inbox for a verification link
            </Box>
          </Box>
        </Alert>
      )}

      <Snackbar
        open={!!resendMessage}
        autoHideDuration={6000}
        onClose={() => setResendMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {resendMessage ? (
          <Alert
            onClose={() => setResendMessage(null)}
            severity={resendMessage.type}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {resendMessage.text}
          </Alert>
        ) : (
          <div />
        )}
      </Snackbar>
    </Box>
  );
};

interface VerificationSuccessBannerProps {
  show: boolean;
  onClose?: () => void;
}

export const VerificationSuccessBanner: React.FC<
  VerificationSuccessBannerProps
> = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <Alert
      severity="success"
      variant="filled"
      onClose={onClose}
      icon={
        <i className="fa-solid fa-circle-check" style={{ fontSize: 24 }}></i>
      }
      sx={{
        borderRadius: 2,
        fontWeight: 500,
        "& .MuiAlert-message": {
          fontSize: "0.9375rem",
        },
      }}
    >
      <strong>Email Verified Successfully!</strong> Your email address has been
      confirmed.
    </Alert>
  );
};

